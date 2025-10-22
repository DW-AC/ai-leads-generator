import fs from "fs";
import ollama from 'ollama';
import myData from './../agencies.json';
import {Agency} from "./interfaces/agency.interface";
import {GoogleSheetWriter} from "./googleSheetWriter";
export class Analyzer {
    public async run() : Promise<void> {
        // const prompt = `Analyze the following JSON data and provide a summary: ${JSON.stringify(myData)}`;
        // const prompt = `Create a visual representation (like a tree or chart) of this JSON: ${JSON.stringify(myData)}`;
        const prompt = `Please Analyze the following JSON data and summarize the reviews and the summarize the profile of each item: ${JSON.stringify(myData)}`;
        // const prompt = `Here is the data for 5 different agencies: ${JSON.stringify(myData[0])}`;
        const response = await ollama.generate({
            model: 'gemma3', // Replace with your desired model
            prompt: prompt,
        });
        console.log('Ollama response:', response.response);
    }

    public async writeToSheet() : Promise<void> {
        const googleSheetWriter = new GoogleSheetWriter('1FFjaZnZDX90_QrFyXRW13ayZU8USHUCmzsFszbU8rp8');

        // const prompt = `Please Analyze the following JSON data and then extract the title, summarized reviews and summarized profile of each item: ${JSON.stringify(myData)}`;
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
            model: 'gemma3', // Replace with your desired model
            prompt: prompt,
            format: schema,
            // format: 'json',
        });
        // console.log('Ollama response:', response.response);
        // console.log('Ollama response:', JSON.parse(response.response));
        console.log('writing to Sheet');
        await googleSheetWriter.write(JSON.parse(response.response));
        console.log('done');
    }
}

(async () => {
    const analyzer = new Analyzer();
    // await analyzer.run();
    await analyzer.writeToSheet();
})();
