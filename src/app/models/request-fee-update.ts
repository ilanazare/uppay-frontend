import { CreditCardFlagEnum } from "../enums/credit-card-flag-enum";
import { TableEnum } from "../enums/table-enum";

export interface RequestFeeUpdate {
    id: number;
    numberTable: TableEnum;
    numberOfInstallments: number;
    flag: CreditCardFlagEnum;
    machineFee: number;
    clientFee: number;
}
