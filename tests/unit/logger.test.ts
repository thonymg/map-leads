import { describe, it, expect, beforeEach, afterEach, vi } from "bun:test";
import { StructuredLogger } from "../../src/logger";
import * as fs from "fs/promises";
import { existsSync } from "fs";

vi.mock('fs/promises', () => ({
    writeFile: vi.fn(),
    mkdir: vi.fn(),
}));

vi.mock('fs', () => ({
    existsSync: vi.fn(),
}));


describe("StructuredLogger", () => {
    const logDir = "./test-logs";
    const scraperName = "test-scraper";

    beforeEach(() => {
        vi.useFakeTimers();
        vi.spyOn(console, 'debug').mockImplementation(() => {});
        vi.spyOn(console, 'info').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    it("should write info log when level is info", async () => {
        const logger = new StructuredLogger({ level: "info", logDir, scraperName });
        (existsSync as vi.Mock).mockReturnValue(true);

        logger.info("Test message", { data: "test" });

        expect(console.info).toHaveBeenCalled();
        
        await vi.advanceTimersByTimeAsync(1000);

        expect(fs.writeFile).toHaveBeenCalled();
        const writeFileCall = (fs.writeFile as vi.Mock).mock.calls[0];
        const logContent = writeFileCall[1];

        expect(logContent).toContain('"level":"info"');
        expect(logContent).toContain('"message":"Test message"');
        expect(logContent).toContain('"data":{"data":"test"}');
        expect(logContent).toContain(`"scraper":"${scraperName}"`);
    });

    it("should not write debug log when level is info", async () => {
        const logger = new StructuredLogger({ level: "info", logDir, scraperName });
        logger.debug("Debug message");
        expect(console.debug).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1000);
        expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it("should create log directory if it does not exist", async () => {
        const logger = new StructuredLogger({ level: "info", logDir, scraperName });
        (existsSync as vi.Mock).mockReturnValue(false);

        logger.info("Test");

        await vi.advanceTimersByTimeAsync(1000);

        expect(fs.mkdir).toHaveBeenCalledWith(logDir, { recursive: true });
    });

    it("should flush logs immediately on error", async () => {
        const logger = new StructuredLogger({ level: "info", logDir, scraperName });
        (existsSync as vi.Mock).mockReturnValue(true);

        logger.error("Error message");

        expect(console.error).toHaveBeenCalled();
        // No need to advance timers, error should flush immediately
        await Promise.resolve(); 
        expect(fs.writeFile).toHaveBeenCalled();
    });

    it("should flush logs on destroy", async () => {
        const logger = new StructuredLogger({ level: "info", logDir, scraperName });
        (existsSync as vi.Mock).mockReturnValue(true);

        logger.info("Info message");
        
        await logger.destroy();

        expect(fs.writeFile).toHaveBeenCalled();
    });
});
