import * as fs from 'fs';
import * as path from 'path';

interface Verification {
    description: string;
    // check function is executing elsewhere, we just document it
}

interface Step {
    title: string;
    image: string;
    verifications: Verification[];
}

export class TestDocumentationHelper {
    private outputDir: string;
    private title: string = "E2E Verification";
    private description: string = "";
    private steps: Step[] = [];

    constructor(outputDir: string) {
        this.outputDir = outputDir;
    }

    setMetadata(title: string, description: string) {
        this.title = title;
        this.description = description;
    }

    addStep(title: string, image: string, verifications: Verification[]) {
        this.steps.push({ title, image, verifications });
    }

    writeReadme() {
        let md = `# ${this.title}\n\n${this.description}\n\n`;

        md += `## Verification Steps\n\n`;

        this.steps.forEach((step, index) => {
            md += `### ${index + 1}. ${step.title}\n\n`;
            md += `**Screenshot**: \`${step.image}\`\n\n`;
            md += `![${step.title}](./screenshots/${step.image})\n\n`;
            md += `**Verifications**:\n`;
            step.verifications.forEach(v => {
                md += `- [x] ${v.description}\n`;
            });
            md += `\n---\n\n`;
        });

        const readmePath = path.join(this.outputDir, 'README.md');
        fs.writeFileSync(readmePath, md);
    }
}
