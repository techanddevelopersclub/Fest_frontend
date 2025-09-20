import { useEffect, useRef, useState } from "react";
import styles from "./Scanner.module.css";
import QRScanner from "qr-scanner";
import {
  useCheckInEntryPassMutation,
  useGetEntryPassByIdQuery,
} from "../../../../state/redux/entryPass/entryPassApi";
import { getEntryPassFromQRData } from "../../../../utils/qr-code";
import { formatDateTime } from "../../../../utils/time";
import { toast } from "../../components/Toast";

const Scanner = () => {
  const videoRef = useRef(null);
  const [result, setResult] = useState(null);
  const [qrScanner, setQrScanner] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [error, setError] = useState(null);
  const [manualId, setManualId] = useState("");
  const {
    data: { entryPass } = {},
    isLoading,
    error: entryPassError,
  } = useGetEntryPassByIdQuery(result?._id);
  const [checkInEntryPass, { isLoading: checkInLoading, error: checkInError }] =
    useCheckInEntryPassMutation();

  useEffect(() => {
    QRScanner?.listCameras()?.then((cameras) => {
      setCameras(cameras);
    });

    const qrs = new QRScanner(
      videoRef.current,
      (output) => {
        setResult(getEntryPassFromQRData(output?.data));
        qrs.stop();
      },
      {
        maxScansPerSecond: 2,
      }
    );
    setQrScanner(qrs);

    return () => {
      qrs.stop();
      qrs.destroy();
    };
  }, []);

  const setCamera = (camera) => {
    qrScanner?.setCamera(camera.id);
  };

  const start = () => {
    setResult(null);
    setError(null);
    qrScanner?.start();
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualId.trim()) {
      setResult({ _id: manualId.trim() });
    }
  };

  const stop = () => {
    qrScanner?.stop();
  };

  const handleCheckInEntryPass = async () => {
    try {
      await checkInEntryPass(entryPass?._id).unwrap();
      toast.success("Checked In Successfully");
      setResult(null);
    } catch (err) {
      toast.error(err?.data?.message || "Something went wrong");
      setError(err?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className={styles.container}>
      {/* Manual Entry Pass ID input */}
      <form onSubmit={handleManualSubmit} className={styles.manualForm} style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={manualId}
          onChange={e => setManualId(e.target.value)}
          placeholder="Enter Entry Pass ID manually"
          className={styles.manualInput}
          style={{ padding: "6px 12px", borderRadius: 4, border: "1px solid #ccc", marginRight: 8 }}
        />
        <button type="submit" style={{ padding: "6px 16px", borderRadius: 4, background: "#6c63ff", color: "#fff", border: "none" }}>
          Fetch
        </button>
      </form>
      <div className={styles.scanner}>
        <video className={styles.video} ref={videoRef}></video>
        <div className={styles.overlay}>
          {!result && <div className={styles.corners}></div>}
        </div>
        {result && (
          <div className={styles.result}>
            {entryPassError && (
              <div className={styles.error}>
                {entryPassError?.data?.message}
              </div>
            )}
            {error && <div className={styles.error}>{error}</div>}
            {isLoading && <div className={styles.loading}>Loading...</div>}
            {!isLoading && (
              <>
                <div className={styles.details}>
                  {entryPass?.isUsed && (
                    <div className={styles.used}>Already Used</div>
                  )}
                  {/* User Profile Popup */}
                  <div className={styles.userProfilePopup}
                      style={{
      maxWidth: "600px",
      margin: "0 auto",
      padding: "5px",
      // borderRadius: "16px",
      background: "#fff",
      // boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      // fontFamily: "Inter, sans-serif",
      fontSize: "14px",
      color: "#333",
    }}
                  >
                    <img
                      src={entryPass?.user?.image}
                      alt={entryPass?.user?.name}
                      className={styles.profileImage}
                      style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", marginBottom: 8 }}
                    />
                                        <a
                      href={`${entryPass?.user?.image}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.openProfileBtn}
                      style={{ display: "inline-block", marginTop: 8, padding: "4px 12px", background: "#6c63ff", color: "#fff", borderRadius: 4, textDecoration: "none" }}
                    >
                      Open Full Profile
                    </a>
                    <div className={styles.profileInfo}>
                      <div><strong>Name:</strong> {entryPass?.user?.name}</div>
                      <div><strong>Email:</strong> {entryPass?.user?.email}</div>
                      <div><strong>Gender:</strong> {entryPass?.user?.gender}</div>
                      <div><strong>Mobile:</strong> {entryPass?.user?.mobile}</div>
                      {/* <div><strong>College:</strong> {entryPass?.user?.college}</div> */}
                    </div>

                  </div>
                  {/* ...existing event and entry details... */}
                  <div className={styles.item}>
                    <p className={styles.key}>Entry Id</p>
                    <p className={styles.value}>{entryPass?._id}</p>
                  </div>
                  <div className={styles.item}>
                    <p className={styles.key}>Event Name</p>
                    <p className={styles.key}>{entryPass?.event?.name}</p>
                  </div>
                  <div className={styles.item}>
                    <p className={styles.key}>Used At</p>
                    <p className={styles.value}>
                      {formatDateTime(entryPass?.usedAt)}
                    </p>
                  </div>
                </div>
                <div className={styles.actions}>
                  <button
                    disabled={entryPass?.isUsed}
                    onClick={handleCheckInEntryPass}
                  >
                    {checkInLoading || isLoading
                      ? "Loading..."
                      : entryPass?.isUsed
                      ? "Already Used"
                      : "Check In"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div className={styles.actions}>
        <button onClick={start}>Start</button>
        <button onClick={stop}>Stop</button>
      </div>
      <select
        className={styles.cameras}
        onChange={(e) => {
          const camera = cameras.find(
            (camera) => camera.label === e.target.value
          );
          setCamera(camera);
        }}
        defaultValue={qrScanner?.camera?.label}
      >
        {cameras.map((camera) => (
          <option key={camera.id} className={styles.camera}>
            {camera.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Scanner;
