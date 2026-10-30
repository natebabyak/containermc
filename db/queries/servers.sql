-- name: SaveServer :exec
INSERT INTO servers (id,name,spec,status) VALUES (?,?,?,?)
ON CONFLICT(id) DO UPDATE SET name=excluded.name,spec=excluded.spec,status=excluded.status;

-- name: GetServer :one
SELECT * FROM servers WHERE id=?;

-- name: ListServers :many
SELECT * FROM servers ORDER BY name,id;

-- name: DeleteServer :exec
DELETE FROM servers WHERE id=?;

-- name: ReservePort :exec
INSERT INTO ports (port,server_id) VALUES (?,?);

-- name: ReleasePort :exec
DELETE FROM ports WHERE server_id=?;

-- name: GetPort :one
SELECT port FROM ports WHERE server_id=?;
