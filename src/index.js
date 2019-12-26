const WDIOReporter = require("@wdio/reporter").default;
const fs = require("fs");
const path = require("path");
const moment = require("moment");

class MarkdownReporter extends WDIOReporter {
    constructor(options) {
        options = Object.assign(options, { stdout: true });
        super(options);
        this.options = options;
        // keep track of the order that suites were called
        this.suiteUids = [];

        this.suites = [];
        this.stateCounts = {
            failed: 0,
            passed: 0
        };
        this.createHeaderReport();
    }

    onTestPass() {
        this.stateCounts.passed++;
    }

    onSuiteStart(suite) {
        this.suiteUids.push(suite.uid);
    }

    onSuiteEnd(suite) {
        this.suites.push(suite);
    }
    onTestSkip() {
        this.stateCounts.skipped++;
    }
    onTestFail() {
        this.stateCounts.failed++;
    }

    onRunnerEnd(runner) {
        this.createReport(runner);
    }

    writeTestReport(filename, report) {
        let folder = '';
        !this.options.outputDir ? (folder = process.cwd()) : (folder = this.options.outputDir);
        const filePath = path.join(folder, filename);
        fs.writeFileSync(filePath, report);
    }
    /**
    * Create a markdown file for each test
    * 
    */
    createReport(runner) {

        const testTemplate = [
            ...this.getFailureDisplay()
        ];
        if (testTemplate.length > 0) {
            let filename = `wdio-${runner.cid}.md`
            this.writeTestReport(filename, testTemplate.join("\n"));
        }

    }

    /**
     * Create the header markdown file
     */
    createHeaderReport() {
        let dateReport = moment().format("MMMM Do YYYY, h:mm:ss");
        let titleReport = `# Markdown Test Report  \n _Report generated on ${dateReport}_ \n`;
        let failedTest = "## Failed Tests   \n \n";
        const headerTemplate = [
            titleReport,
            failedTest,
        ];
        let filename = 'header.md';
        let folder = this.options.outputDir;
        let filePath = path.join(folder, filename);
        fs.writeFileSync(filePath, headerTemplate.join('\n'));
    }
    /**
    * Get display for failed tests, e.g. stack trace
    * @return {Array} Stack trace output
    */
    getFailureDisplay() {
        let output = [];
        this.getOrderedSuites().map(suite =>
            suite.tests.map(test => {
                if (test.state === "failed") {
                    output.push(
                        `__${test.error.message}__ \n  > **AssertionError:**  ${test.error.stack} \n\n`
                    );
                }
            })
        );

        return output;
    }

    /**
     * Get suites in the order they were called
     * @return {Array} Ordered suites
     */
    getOrderedSuites() {
        this.orderedSuites = [];

        this.suiteUids.map(uid =>
            this.suites.map(suite => {
                if (suite.uid === uid) {
                    this.orderedSuites.push(suite);
                }
            })
        );

        return this.orderedSuites;
    }
}

module.exports = MarkdownReporter;