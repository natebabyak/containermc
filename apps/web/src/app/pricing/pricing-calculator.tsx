"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import { CPU_PRICE, MEMORY_PRICE } from "@/lib/constants";

export function PricingCalculator() {
  const [players, setPlayers] = useState(1);
  const [hours, setHours] = useState(0.25);

  return (
    <Card className="max-w-sm w-full mx-auto">
      <CardHeader>
        <CardTitle>
          $
          {(
            players *
            (CPU_PRICE / 4 + MEMORY_PRICE / 2) *
            hours *
            3600 *
            30
          ).toLocaleString("en-US", {
            maximumSignificantDigits: 6,
          })}{" "}
          / Month
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel>Concurrent Players</FieldLabel>
            <Slider
              min={1}
              max={100}
              value={players}
              onValueChange={(value) => setPlayers(value as number)}
            />
            <FieldDescription>
              {players} Player{players !== 1 ? "s" : ""}
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Playtime</FieldLabel>
            <Slider
              min={0.25}
              max={24}
              step={0.25}
              value={hours}
              onValueChange={(value) => setHours(value as number)}
            />
            <FieldDescription>
              {hours} Hour{hours !== 1 ? "s" : ""} / Day
            </FieldDescription>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
