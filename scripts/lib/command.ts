export interface Command {
	/** Invocation name, e.g. `gen-og`. */
	name: string
	/** One-line description shown in `cli help`. */
	summary: string
	/** Runs the command. Receives args after the command name. */
	run: (args: string[]) => Promise<void> | void
}
