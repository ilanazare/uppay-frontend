export interface LoanResponse {
    id: number;
    customer: string;
    purchaseValue: number;
    numberOfInstallments: number;
    installmentValue: number;
    amountRetainedByMachine: number;
    amountReleasedByMachine: number;
    amountRetained: number;
    amountReleasedForClient: number;
    purchaseDate: Date;
}
