import { reportService } from './src/services/report.service';

async function main() {
  const userId = 'f7e073b4-5852-4891-90ca-717583994446'; // Lakshay Kaushik
  console.log('Executing getWellnessReportBrief for user:', userId);
  try {
    const result = await reportService.getWellnessReportBrief(userId, 'month');
    console.log('SUCCESS RESULT:');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('FAILED WITH ERROR:', err);
  }
}

main();
