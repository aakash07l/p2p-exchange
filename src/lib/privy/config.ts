import type { PrivyClientConfig } from '@privy-io/react-auth';

export const privyConfig: PrivyClientConfig = {
  loginMethods: ['email', 'google', 'wallet'],
  appearance: {
    theme: 'light',
    accentColor: '#125fe8',
    showWalletLoginFirst: false,
    loginMessage: 'Welcome to FastX P2P — trade crypto securely',
    walletChainType: 'ethereum-only',
  },
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'all-users',
    },
  },
  mfa: {
    noPromptOnMfaRequired: false,
  },
};
