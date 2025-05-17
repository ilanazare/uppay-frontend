import { CreditCardFlagEnum } from "../enums/credit-card-flag-enum";

export interface LoanRequest {
    customer: string;
    flag: CreditCardFlagEnum;
    numberOfInstallments: number;
    purchaseValue: number;
}
