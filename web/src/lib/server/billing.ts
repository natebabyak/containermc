import { computeSessionCost } from '$lib/helpers';
import { db } from '$lib/server/db';
import {
	balanceTransaction,
	organizationBalance
} from '$lib/server/db/schema';
import { and, eq, sql } from 'drizzle-orm';

export class InsufficientBalanceError extends Error {
	constructor(message = 'Insufficient balance') {
		super(message);
		this.name = 'InsufficientBalanceError';
	}
}

export async function getOrganizationBalance(organizationId: string): Promise<number> {
	const row = await db.query.organizationBalance.findFirst({
		where: (organizationBalance, { eq }) => eq(organizationBalance.organizationId, organizationId),
		columns: { amountDollars: true }
	});

	return row ? parseFloat(row.amountDollars) : 0;
}

export function getMinimumStartBalance(hardwareName: string): number {
	const start = new Date();
	const end = new Date(start.getTime() + 60_000);
	return computeSessionCost(hardwareName, start, end);
}

export async function canAffordStart(
	organizationId: string,
	hardwareName: string
): Promise<boolean> {
	const balance = await getOrganizationBalance(organizationId);
	return balance >= getMinimumStartBalance(hardwareName);
}

export function getEstimatedSessionCost(session: {
	hardwareName: string;
	startedAt: Date;
}): number {
	return computeSessionCost(session.hardwareName, session.startedAt, new Date());
}

export async function creditDeposit(
	organizationId: string,
	amountDollars: number,
	stripeCheckoutSessionId: string
): Promise<boolean> {
	const existing = await db.query.balanceTransaction.findFirst({
		where: (balanceTransaction, { eq }) =>
			eq(balanceTransaction.stripeCheckoutSessionId, stripeCheckoutSessionId),
		columns: { id: true }
	});

	if (existing) {
		return false;
	}

	const amount = amountDollars.toFixed(6);

	await db.transaction(async (tx) => {
		const currentBalance = await tx.query.organizationBalance.findFirst({
			where: (organizationBalance, { eq }) =>
				eq(organizationBalance.organizationId, organizationId),
			columns: { amountDollars: true }
		});

		if (currentBalance) {
			const newBalance = parseFloat(currentBalance.amountDollars) + amountDollars;
			await tx
				.update(organizationBalance)
				.set({ amountDollars: newBalance.toFixed(6) })
				.where(eq(organizationBalance.organizationId, organizationId));
		} else {
			await tx.insert(organizationBalance).values({
				organizationId,
				amountDollars: amount
			});
		}

		await tx.insert(balanceTransaction).values({
			organizationId,
			type: 'deposit',
			amountDollars: amount,
			stripeCheckoutSessionId
		});
	});

	return true;
}

export async function chargeSession(
	organizationId: string,
	sessionId: string,
	costDollars: number
): Promise<boolean> {
	const existing = await db.query.balanceTransaction.findFirst({
		where: (balanceTransaction, { eq }) =>
			eq(balanceTransaction.minecraftServerSessionId, sessionId),
		columns: { id: true }
	});

	if (existing) {
		return true;
	}

	const amount = costDollars.toFixed(6);

	const charged = await db.transaction(async (tx) => {
		const [updated] = await tx
			.update(organizationBalance)
			.set({
				amountDollars: sql`${organizationBalance.amountDollars}::numeric - ${amount}::numeric`
			})
			.where(
				and(
					eq(organizationBalance.organizationId, organizationId),
					sql`${organizationBalance.amountDollars}::numeric >= ${amount}::numeric`
				)
			)
			.returning({ amountDollars: organizationBalance.amountDollars });

		if (!updated) {
			return false;
		}

		await tx.insert(balanceTransaction).values({
			organizationId,
			type: 'session_charge',
			amountDollars: amount,
			minecraftServerSessionId: sessionId
		});

		return true;
	});

	if (!charged) {
		throw new InsufficientBalanceError();
	}

	return true;
}

export async function shouldStopForBalance(
	organizationId: string,
	session: { hardwareName: string; startedAt: Date }
): Promise<boolean> {
	const balance = await getOrganizationBalance(organizationId);
	const estimatedCost = getEstimatedSessionCost(session);
	const buffer = getMinimumStartBalance(session.hardwareName);
	return balance < estimatedCost + buffer;
}

export type BalanceTransaction = typeof balanceTransaction.$inferSelect;

export async function getOrganizationTransactions(
	organizationId: string,
	limit = 50
): Promise<BalanceTransaction[]> {
	return db.query.balanceTransaction.findMany({
		where: (balanceTransaction, { eq }) => eq(balanceTransaction.organizationId, organizationId),
		orderBy: (balanceTransaction, { desc }) => [desc(balanceTransaction.createdAt)],
		limit
	});
}
