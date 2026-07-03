const XLSX = require('xlsx');

const data = [
  { Question: 'Màu nhận diện chính của ĐHBK là gì?', A: 'Đỏ', B: 'Xanh dương (Navy)', C: 'Vàng', D: 'Xanh lá', Correct: 'B', Time: 20 },
  { Question: 'Năm thành lập của ĐHBK TPHCM?', A: '1957', B: '1975', C: '1990', D: '2000', Correct: 'A', Time: 15 },
  { Question: 'Cơ sở chính của ĐHBK nằm ở quận nào?', A: 'Quận 1', B: 'Quận 10', C: 'Thủ Đức', D: 'Quận 5', Correct: 'B', Time: 15 }
];

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Questions");
XLSX.writeFile(wb, 'sample_questions.xlsx');
console.log('Created sample_questions.xlsx');
