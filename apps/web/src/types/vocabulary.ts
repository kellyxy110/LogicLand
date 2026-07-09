// A coding word a young explorer learns — the shape behind the Word Wall.
// Word + picture (emoji) + meaning + example, all kid-sized. Voice is layered on
// at render time via the speech service, so the data stays plain and portable.
export interface VocabWord {
  id: string;
  /** The term itself, e.g. "Loop". */
  word: string;
  /** A one-sentence, age-6 definition. */
  meaning: string;
  /** The "picture" — an emoji shown large on the card. */
  emoji: string;
  /** A friendly sentence that uses the word in context. */
  example: string;
}
