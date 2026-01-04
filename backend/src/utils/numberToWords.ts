// Convert number to Indian currency words
export const numberToWords = (num: number): string => {
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];

  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const convertHundreds = (n: number): string => {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result.trim();
  };

  if (num === 0) return 'Zero';

  const crores = Math.floor(num / 10000000);
  const lakhs = Math.floor((num % 10000000) / 100000);
  const thousands = Math.floor((num % 100000) / 1000);
  const hundreds = num % 1000;
  const paise = Math.round((num % 1) * 100);

  let words = '';

  if (crores > 0) {
    words += convertHundreds(crores) + ' Crore ';
  }
  if (lakhs > 0) {
    words += convertHundreds(lakhs) + ' Lakh ';
  }
  if (thousands > 0) {
    words += convertHundreds(thousands) + ' Thousand ';
  }
  if (hundreds > 0) {
    words += convertHundreds(hundreds);
  }

  if (words.trim() === '') {
    words = 'Zero';
  }

  words = 'Indian Rupee ' + words.trim() + ' Only';

  if (paise > 0) {
    words = words.replace(' Only', '');
    words += ' and ' + convertHundreds(paise) + ' Paise Only';
  }

  return words;
};

