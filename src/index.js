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

        this.output = [];
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
    /**
     * Write the file with the config properties
     */
    writeFile(report) {
        let filename = '';
        let folder = '';
        !this.options.outputDir ? (folder = process.cwd()) : (folder = this.options.outputDir);
        !this.options.filename ? (filename = 'markdownReport.md') : (filename = `${this.options.filename}.md`);
        const filePath = path.join(folder, filename);
        fs.writeFileSync(filePath, report);
    }
    /**
     * Create the file with the Markdown report
     */
    createReport() {
        let dateReport = moment().format("MMMM Do YYYY, h:mm:ss");
        let titleReport = `# Markdown Test Report  \n _Report generated on ${dateReport}_ \n`;
        let failedTest = "## Failed Tests   \n \n";
        const markdownTemplate = [
            titleReport,
            this.getCountDisplay(),
            failedTest,
            ...this.getFailureDisplay()
        ];

        this.writeFile(markdownTemplate.join("\n"));
    }

    /**
     * Get the display for passed/failed tests
     * @return {String} Count display
     */
    getCountDisplay() {
        let output = [];
        const failedTestsCount = this.stateCounts.failed;
        const passsedTestsCount = this.stateCounts.passed;
        output.push(
            `- ${failedTestsCount} failed \n` + `- ${passsedTestsCount} passed \n`
        );
        return output;
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
                        `__${test.error.message}__ \n  > **AssertionError:**  ${test.error.stack}`
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
