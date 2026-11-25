CREATE TABLE replies (
  key_hash TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  attending INTEGER NOT NULL CHECK (attending IN (0,1)),
  guests INTEGER NOT NULL CHECK ((attending=0 AND guests=0) OR (attending=1 AND guests>=1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
