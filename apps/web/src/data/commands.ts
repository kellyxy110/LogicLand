// Typed accessor over the JSON command grammar. Keeping the vocabulary in JSON
// (per platform config convention) while exposing a typed surface to the app.
import type { CommandDef, CommandGrammar, CommandId } from "@/types/game";
import raw from "./commands.json";

export const COMMAND_GRAMMAR: CommandGrammar = raw.commands as CommandDef[];

const BY_ID = new Map<CommandId, CommandDef>(
  COMMAND_GRAMMAR.map((c) => [c.id, c]),
);

/** Look up a command definition (icon, hint, aliases) by id. */
export function commandDef(id: CommandId): CommandDef | undefined {
  return BY_ID.get(id);
}

/** Ordered subset of the grammar for a mission's palette. */
export function paletteDefs(ids: CommandId[]): CommandDef[] {
  return ids
    .map((id) => BY_ID.get(id))
    .filter((c): c is CommandDef => c !== undefined);
}
