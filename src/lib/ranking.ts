// Hacker News style "hot" score: gravity-decayed vote score.
export function hotScore(voteCount: number, createdAt: Date, gravity = 1.6) {
  const ageHours = (Date.now() - createdAt.getTime()) / 36e5;
  return (voteCount + 1) / Math.pow(ageHours + 2, gravity);
}
