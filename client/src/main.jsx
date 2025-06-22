import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import { persistor, store } from "./store";
import { PersistGate } from "redux-persist/integration/react";
import NetworkServiceProvider from "./Utils/NetworkServiceProvider.jsx";
import { networkService } from "./Utils/NetworkService";
export { networkService };
import I18nLoader from "./Components/I18nLoader";

ReactDOM.createRoot(document.getElementById("root")).render(
	<Provider store={store}>
		<PersistGate
			loading={null}
			persistor={persistor}
		>
			<I18nLoader />
			<Router>
				<NetworkServiceProvider>
					<App />
				</NetworkServiceProvider>
			</Router>
		</PersistGate>
	</Provider>
);
