const MOCK_OTP_CODE = '123456';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const sendMockOtpToPhone = async (phoneNumber: string): Promise<string> => {
  const digitsOnly = phoneNumber.replace(/[^\d+]/g, '');
  if (!digitsOnly) {
    throw new Error('A valid mobile number is required');
  }

  await delay(600);
  return MOCK_OTP_CODE;
};

export const verifyMockOtpCode = async (code: string): Promise<boolean> => {
  await delay(250);
  return code.trim() === MOCK_OTP_CODE;
};

export const getMockOtpCode = () => MOCK_OTP_CODE;
