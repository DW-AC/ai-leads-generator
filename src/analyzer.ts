import fs from "fs";
import ollama from 'ollama';
import myData from './../agencies.json';
import {Agency} from "./interfaces/agency.interface";
import {GoogleSheetWriter} from "./google/googleSheetWriter";
import {GoogleSheetReader} from "./google/googleSheetReader";
export class Analyzer {
    readonly GOOGLE_SHEET_ID: string = "1FFjaZnZDX90_QrFyXRW13ayZU8USHUCmzsFszbU8rp8";

    public async run() : Promise<void> {
        const prompt = `Analyze the following JSON data and provide a summary: ${JSON.stringify(myData)}`;
        // const prompt = `Please Analyze the following JSON data and summarize the reviews and the summarize the profile of each item: ${JSON.stringify(myData)}`;
        const response = await ollama.generate({
            model: 'gemma3',
            prompt: prompt,
        });
        console.log('Ollama response:', response.response);
    }

    public async writeToSheet() : Promise<void> {
        const googleSheetWriter = new GoogleSheetWriter(this.GOOGLE_SHEET_ID);

        const prompt = `Please extract the "title", summarize the "reviews", create a shorter summary of the "profile" from the following JSON data: ${JSON.stringify(myData)}`;

        const schema = {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    reviews: { type: 'string' },
                    profile: { type: 'string' }
                }
            },
        };

        const response = await ollama.generate({
            model: 'gemma3',
            prompt: prompt,
            format: schema,
        });

        console.log('writing to Sheet');
        await googleSheetWriter.write(JSON.parse(response.response));
        console.log('done');
    }

    // public async contactLeads() : Promise<void> {
    //     const prompt = "Your name is \"Jymyl Bandong\" and you are the CEO of a web development company named \"DevDaddies\".\n" +
    //         "\n" +
    //         "Your contact phone is \"1234567890\" and your email is \"jym@devdaddies.com\".\n" +
    //         "\n" +
    //         "Do not show any notes and customization guidelines." +
    //         "\n" +
    //         "Analyze the following JSON data that contains a provider and compose an email inviting them for a collaboration project: " + JSON.stringify(myData[0]);
    //
    //     // const prompt = `Please Analyze the following JSON data and summarize the reviews and the summarize the profile of each item: ${JSON.stringify(myData)}`;
    //     const response = await ollama.generate({
    //         model: 'gemma3', // Replace with your desired model
    //         prompt: prompt,
    //     });
    //     console.log('Ollama response:', response.response);
    // }

    public async contactLeadsFromSheet() : Promise<void> {
        const googleSheetReader = new GoogleSheetReader(this.GOOGLE_SHEET_ID);
        let leads : any[] = await googleSheetReader.read();

        const prompt = "Your name is \"Jymyl Bandong\" and you are the CEO of a web development company named \"DevDaddies\".\n" +
            "\n" +
            "Your contact phone is \"1234567890\" and your email is \"jym@devdaddies.com\".\n" +
            "\n" +
            "Do not show any notes and customization guidelines." +
            "\n" +
            "Analyze the following JSON data that contains a provider and compose an email inviting them for a collaboration project: " + JSON.stringify(leads[1]);

        // const prompt = `Please Analyze the following JSON data and summarize the reviews and the summarize the profile of each item: ${JSON.stringify(myData)}`;
        const response = await ollama.generate({
            model: 'qwen3-coder:480b-cloud', // Replace with your desired model
            prompt: prompt,
        });
        console.log('Ollama response:', response.response);
    }
}

(async () => {
    const analyzer = new Analyzer();
    // await analyzer.run();
    // await analyzer.writeToSheet();
    // await analyzer.contactLeads();
    await analyzer.contactLeadsFromSheet();
})();
