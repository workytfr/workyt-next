import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
const files = [
  'Question.ts','PointTransaction.ts','Notification.ts','Quiz.ts',
  'NewsletterBatch.ts','Lesson.ts','Exercise.ts','CourseProgress.ts',
  'Answer.ts','QuizCompletion.ts','Section.ts','Comment.ts',
];

const root = 'src/models';

for (const f of files) {
  const path = join(root, f);
  let src = readFileSync(path, 'utf8');
  const before = src;

  src = src.replace(
    /(import\s+[^;]*from\s+['"]mongoose['"];?)/,
    (line) => {
      if (!line.includes('ObjectId')) return line;
      let newLine = line.replace(/,\s*ObjectId\b/, '').replace(/\bObjectId\s*,\s*/, '');
      if (!/\bTypes\b/.test(newLine)) {
        newLine = newLine.replace(/\{([^}]*)\}/, (m, inner) => `{${inner.trimEnd()}, Types }`);
      }
      return newLine;
    }
  );

  src = src.replace(/^[ \t]*_id\s*:\s*ObjectId\s*;?\s*\n/m, '');
  src = src.replace(/(?<!\.)\bObjectId\b/g, 'Types.ObjectId');

  if (src !== before) {
    writeFileSync(path, src);
    console.log(`fixed: ${path}`);
  } else {
    console.log(`skipped (no change): ${path}`);
  }
}
