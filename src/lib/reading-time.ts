export const readingTime = (text: string) => `${Math.max(1, Math.round(text.split(/\s+/).length / 200))} min read`;
