module.exports = {
  GoogleGenAI: class {
    constructor() {}
    live = {
      connect: jest.fn().mockResolvedValue({
        sendClientContent: jest.fn(),
        sendRealtimeInput: jest.fn(),
        receive: jest.fn().mockReturnValue([]),
        close: jest.fn()
      })
    }
  }
};
