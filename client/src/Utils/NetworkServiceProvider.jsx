import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { setNetworkService } from "./NetworkService";
import NetworkService, { networkService } from "./NetworkService";
import { store } from "../store";

const NetworkServiceProvider = ({ children }) => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	if (!networkService) {
		setNetworkService(new NetworkService(store, dispatch, navigate));
	}
	return children;
};

export default NetworkServiceProvider;
