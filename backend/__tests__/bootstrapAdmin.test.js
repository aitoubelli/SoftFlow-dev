const { createAdminIfNotExists } = require('../src/utils/bootstrapAdmin');

// Mock the User model
jest.mock('../src/models/User.model');

const User = require('../src/models/User.model');

describe('createAdminIfNotExists', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        // Reset process.env
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    test('should do nothing if ADMIN_EMAIL is not set', async () => {
        delete process.env.ADMIN_EMAIL;
        process.env.ADMIN_PASSWORD = 'password';

        await createAdminIfNotExists();

        expect(User.findOne).not.toHaveBeenCalled();
        expect(User).not.toHaveBeenCalled();
    });

    test('should do nothing if ADMIN_PASSWORD is not set', async () => {
        process.env.ADMIN_EMAIL = 'admin@test.com';
        delete process.env.ADMIN_PASSWORD;

        await createAdminIfNotExists();

        expect(User.findOne).not.toHaveBeenCalled();
        expect(User).not.toHaveBeenCalled();
    });

    test('should create admin if env vars are set and user does not exist', async () => {
        process.env.ADMIN_EMAIL = 'admin@test.com';
        process.env.ADMIN_PASSWORD = 'password';

        User.findOne.mockResolvedValue(null);
        const mockSave = jest.fn().mockResolvedValue();
        User.mockImplementation(() => ({
            save: mockSave
        }));

        await createAdminIfNotExists();

        expect(User.findOne).toHaveBeenCalledWith({ email: 'admin@test.com' });
        expect(User).toHaveBeenCalledWith({
            name: 'Admin',
            email: 'admin@test.com',
            password: 'password',
            role: 'admin'
        });
        expect(mockSave).toHaveBeenCalled();
    });

    test('should do nothing if admin already exists', async () => {
        process.env.ADMIN_EMAIL = 'admin@test.com';
        process.env.ADMIN_PASSWORD = 'password';

        User.findOne.mockResolvedValue({ email: 'admin@test.com' });

        await createAdminIfNotExists();

        expect(User.findOne).toHaveBeenCalledWith({ email: 'admin@test.com' });
        expect(User).not.toHaveBeenCalled();
    });
});
