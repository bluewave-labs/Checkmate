import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
	UnsafeBurnerWalletAdapter,
	PhantomWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import PropTypes from "prop-types";
import "./index.css"; 

// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";

export const Wallet = ({ children }) => {
	// The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
	const network = WalletAdapterNetwork.Mainnet;

	// You can also provide a custom RPC endpoint.
	const endpoint = useMemo(() => clusterApiUrl(network), [network]);

	const wallets = useMemo(
		() => [new PhantomWalletAdapter()],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[network]
	);

	return (
		<ConnectionProvider endpoint={endpoint}>
			<WalletProvider
				wallets={wallets}
				autoConnect
			>
				<WalletModalProvider>{children}</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
};

Wallet.propTypes = {
	children: PropTypes.node,
};

export default Wallet;
