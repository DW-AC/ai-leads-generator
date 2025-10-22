import {GoogleSpreadsheet} from 'google-spreadsheet';
import {JWT} from 'google-auth-library';
import {Agency} from './interfaces/agency.interface';

export class GoogleSheetWriter {
    private doc : GoogleSpreadsheet;
    private serviceAccountAuth : JWT;

    constructor(spreadsheetId : string) {
        const creds = require('../credentials.json');
        this.serviceAccountAuth = new JWT({
            email  : creds.client_email,
            key    : creds.private_key,
            scopes : [
                'https://www.googleapis.com/auth/spreadsheets',
            ],
        });
        this.doc = new GoogleSpreadsheet(spreadsheetId, this.serviceAccountAuth);
    }

    public async write(data : any[]) : Promise<void> {
        console.log(data);
        await this.doc.loadInfo();
        const sheet = this.doc.sheetsByIndex[0];
        await sheet.clear();
        await sheet.setHeaderRow(Object.keys(data[0]));
        await sheet.addRows(data);
    }
}
