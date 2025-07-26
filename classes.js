class Player {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.profession = '',
        this.score = 0;
        this.pos = -1;
        this.salary = 0;
        this.income = {};
        this.totalIncome = 0;
        this.expenses = {
            taxes: 0,
            homeMortgagePayment: 0,
            schoolLoanPayment: 0,
            carLoanPayment: 0,
            creditCardPayment: 0,
            retailPayment: 0,
            otherExpenses: 0,
            childExpense: 0,
        };
        this.totalExpenses = 0;
        this.savings = 0;
        this.assets = {};
        this.liabilities = {
            homeMortgage: 0,
            schoolsLoans: 0,
            carLoans: 0,
            creditCards: 0,
            retailDebt: 0,
        };
        this.children = 0;
        this.charity = 0;
        this.downsized = 0;
    }
}

module.exports = {
    Player
};