const fs = require('fs');

const files = [
  'src/pages/Evaluation.tsx', 
  'src/pages/Exams.tsx', 
  'src/pages/Financial.tsx', 
  'src/pages/Identification.tsx', 
  'src/pages/Plan.tsx', 
  'src/pages/Reports.tsx', 
  'src/pages/Sessions.tsx',
  'src/components/Layout.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    c = c.replace(/import React, { useState } from 'react';/, "import { useState } from 'react';");
    c = c.replace(/import React from 'react';\n/, "");
    
    // Fix Exams.tsx unused setExams
    if (f.includes('Exams.tsx')) {
        c = c.replace(/const \[exams, setExams\] = useState<any\[\]>\(\[\]\);/, "const [exams] = useState<any[]>([]);");
    }
    // Fix Financial.tsx unused DollarSign, CreditCard
    if (f.includes('Financial.tsx')) {
        c = c.replace(/import { Save, DollarSign, CreditCard, Activity } from 'lucide-react';/, "import { Save, Activity } from 'lucide-react';");
    }
    
    fs.writeFileSync(f, c);
  }
});
console.log('Fixed TS issues');
