import CurrentStats from "./CurrentStats";
import "./index.css";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { getMonitorsByUserId } from "../../Features/Monitors/monitorsSlice";
import FirstComponent from "../../Components/VibhutiComponent";

const Monitors = () => {
  const monitorState = useSelector((state) => state.monitors);
  const authstate = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getMonitorsByUserId(authstate.authToken));
  }, []);

  return (
    <div className="monitors">
      <CurrentStats monitors={monitorState.monitors} />
    </div>
  );
};

export default Monitors;
