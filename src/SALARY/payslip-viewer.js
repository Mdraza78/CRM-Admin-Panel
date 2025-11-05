document.addEventListener('DOMContentLoaded', () => {
    // URL parameters
    const params = new URLSearchParams(window.location.search);

    // --- 1. GET VALUES FROM URL ---
    const employee = {
        name: params.get('name') || '-',
        id: params.get('id') || '-',
        title: params.get('title') || '-',
        email: params.get('email') || '-',
        pan: params.get('pan') || '-',
        account: params.get('account') || '-',
    };
    const salary = {
        workingDays: parseFloat(params.get('workingDays')) || 0,
        lopDays: parseFloat(params.get('lopDays')) || 0,
        basic: parseFloat(params.get('basic')) || 0,
        allowance: parseFloat(params.get('allowance')) || 0,
        tax: parseFloat(params.get('tax')) || 0,
    };

    // --- 2. PERFORM CALCULATIONS ---
    const totalEarnings = salary.basic + salary.allowance;
    const dailyPay = salary.workingDays > 0 ? salary.basic / salary.workingDays : 0;
    const lopDeduction = dailyPay * salary.lopDays;
    const totalDeductions = salary.tax + lopDeduction;
    const netPayable = totalEarnings - totalDeductions;

    // --- 3. UPDATE PAYSLIP DISPLAY ---
    document.title = `Payslip - ${employee.name}`; // Update browser tab title
    
    // Employee Info
    document.getElementById('empNameDisplay').textContent = employee.name;
    document.getElementById('empIdDisplay').textContent = employee.id;
    document.getElementById('empTitleDisplay').textContent = employee.title;
    document.getElementById('empEmailDisplay').textContent = employee.email;
    document.getElementById('empPanDisplay').textContent = employee.pan;
    document.getElementById('empAccountDisplay').textContent = employee.account;
    document.getElementById('workingDaysDisplay').textContent = salary.workingDays;
    document.getElementById('lopDaysDisplay').textContent = salary.lopDays;

    // Set current month and year
    const now = new Date();
    const monthYear = now.toLocaleString('default', { month: 'long' }) + ' ' + now.getFullYear();
    document.getElementById('payslipMonth').textContent = `Payslip for the month of ${monthYear}`;

    // Earnings
    document.getElementById('basicPayDisplay').textContent = salary.basic.toFixed(2);
    document.getElementById('splAllowanceDisplay').textContent = salary.allowance.toFixed(2);
    document.getElementById('totalEarningsDisplay').textContent = totalEarnings.toFixed(2);

    // Deductions
    document.getElementById('taxDisplay').textContent = salary.tax.toFixed(2);
    document.getElementById('lopDaysDeductionDisplay').textContent = lopDeduction.toFixed(2);
    document.getElementById('totalDeductionsDisplay').textContent = totalDeductions.toFixed(2);

    // Final Net Pay
    document.getElementById('netPayableDisplay').textContent = `${netPayable.toLocaleString('en-IN', {minimumFractionDigits: 2})} INR`;
    document.getElementById('amountInWordsDisplay').textContent = `( Rupees ${numberToWords(netPayable)} Only )`;

    // --- FUNCTION TO CONVERT NUMBER TO WORDS ---
    function numberToWords(num) {
        const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const n = ('000000000' + Math.floor(num)).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return 'Zero';
        let str = '';
        str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Crore ' : '';
        str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' Lakh ' : '';
        str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' Thousand ' : '';
        str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' Hundred ' : '';
        str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
        return str.trim() || 'Zero';
    }
});