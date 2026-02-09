import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import { persistor, store } from "./store.js";
import { PersistGate } from "redux-persist/integration/react";
import I18nLoader from "./Components/v1/I18nLoader/index.jsx";
import { initApiClient } from "./Utils/ApiClient.js";

initApiClient(store);

ReactDOM.createRoot(document.getElementById("root")!).render(
	<Provider store={store}>
		<PersistGate
			loading={null}
			persistor={persistor}
		>
			<I18nLoader />
			<Router>
				<App />
			</Router>
		</PersistGate>
	</Provider>
);
