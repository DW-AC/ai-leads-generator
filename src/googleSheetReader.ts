import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export class GoogleSheetReader {
  private doc: GoogleSpreadsheet;
  private serviceAccountAuth: JWT;

  constructor(spreadsheetId: string) {
    const creds = require('../credentials.json');
    this.serviceAccountAuth = new JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });
    this.doc = new GoogleSpreadsheet(spreadsheetId, this.serviceAccountAuth);
  }

  public async read(sheetIndex: number = 0): Promise<any[]> {
    await this.doc.loadInfo();
    const sheet = this.doc.sheetsByIndex[sheetIndex];
    const rows = await sheet.getRows();
    return rows.map(row => row.toObject());
  }
}
