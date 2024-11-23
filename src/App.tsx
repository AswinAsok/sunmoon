import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { useSpring, animated } from "@react-spring/web"; // Import react-spring
import "./App.css";

// Define the shape of the game scores
interface GameScore {
    name: string;
    score: number;
}

export default function SunVsMoon() {
    const [sunScore, setSunScore] = useState<number>(0);
    const [moonScore, setMoonScore] = useState<number>(0);

    const [mySunScore, setMySunScore] = useState<number>(
        parseInt(localStorage.getItem("mySunScore") || "0")
    );
    const [myMoonScore, setMyMoonScore] = useState<number>(
        parseInt(localStorage.getItem("myMoonScore") || "0")
    );

    const [sunPointsPerSec, setSunPointsPerSec] = useState<number>(0);
    const [moonPointsPerSec, setMoonPointsPerSec] = useState<number>(0);

    const prevSunScore = useRef<number>(0);
    const prevMoonScore = useRef<number>(0);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Smooth animation for scores using react-spring
    const animatedSunScore = useSpring({ value: sunScore, from: { value: prevSunScore.current } });
    const animatedMoonScore = useSpring({
        value: moonScore,
        from: { value: prevMoonScore.current },
    });

    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         incrementScore("sun");
    //         incrementScore("moon");

    //         incrementScore("sun");
    //         incrementScore("moon");

    //         incrementScore("sun");
    //         incrementScore("moon");

    //         incrementScore("sun");
    //         incrementScore("moon");

    //         incrementScore("sun");
    //         incrementScore("moon");
    //     }, 1000);

    //     return () => clearInterval(interval);
    // }, []);

    useEffect(() => {
        // Fetch initial scores
        const fetchScores = async () => {
            const { data, error } = await supabase.from("game_scores").select("*");

            if (error) {
                console.error("Error fetching scores:", error);
                return;
            }

            if (data) {
                setSunScore(data.find((item) => item.name === "sun")?.score || 0);
                setMoonScore(data.find((item) => item.name === "moon")?.score || 0);
            }
        };

        fetchScores();

        // Subscribe to realtime updates
        const subscription = supabase
            .channel("public:game_scores") // Specify the channel
            .on(
                "postgres_changes", // Event type
                {
                    event: "*", // All events (INSERT, UPDATE, DELETE)
                    schema: "public", // Schema name
                    table: "game_scores", // Table name
                },
                (payload) => {
                    // Handle real-time updates
                    if ((payload.new as { name: string; score: number }).name === "sun")
                        setSunScore((payload.new as { name: string; score: number }).score);
                    if ((payload.new as { name: string; score: number }).name === "moon")
                        setMoonScore((payload.new as { name: string; score: number }).score);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // Calculate points/sec
        const interval = setInterval(() => {
            const sunChange = sunScore - prevSunScore.current;
            const moonChange = moonScore - prevMoonScore.current;

            setSunPointsPerSec(sunChange);
            setMoonPointsPerSec(moonChange);

            prevSunScore.current = sunScore;
            prevMoonScore.current = moonScore;
        }, 500);

        return () => clearInterval(interval);
    }, [sunScore, moonScore]);

    const incrementScore = async (name: "sun" | "moon") => {
        if (name === "sun") {
            setMySunScore((prev) => {
                const newScore = prev + 1;
                localStorage.setItem("mySunScore", newScore.toString());
                return newScore;
            });
        } else if (name === "moon") {
            setMyMoonScore((prev) => {
                const newScore = prev + 1;
                localStorage.setItem("myMoonScore", newScore.toString());
                return newScore;
            });
        }

        const { error } = await supabase.rpc("increment_score", { input_name: name });
        if (error) {
            console.error("Error:", error.message);
        }
    };

    return (
        <div className="container">
            <h1 className="title">Sun vs Moon</h1>
            <p className="tagline">Click the buttons to score points for the sun and moon!</p>

            <div className="score-section">
                {/* Sun Section */}
                <motion.div className="section" whileHover={{ scale: 1.05 }}>
                    <motion.img
                        src="https://img.icons8.com/emoji/96/sun-emoji.png"
                        alt="Sun"
                        className="image"
                    />

                    {/* Smooth animated score */}
                    <h2 className="score">
                        Total:{" "}
                        <animated.span>
                            {animatedSunScore.value.to((val) => Math.floor(val))}
                        </animated.span>{" "}
                        Points
                    </h2>
                    <button className="button sun-button" onClick={() => incrementScore("sun")}>
                        +1 Sun
                    </button>
                    <h3 className="my-score">You've scored {mySunScore} points for the sun</h3>
                    <h4 className="points-per-sec">{sunPointsPerSec} Points per second</h4>
                </motion.div>

                {/* Moon Section */}
                <motion.div className="section" whileHover={{ scale: 1.05 }}>
                    <motion.img
                        src="https://img.icons8.com/emoji/96/full-moon-emoji.png"
                        alt="Moon"
                        className="image"
                    />

                    {/* Smooth animated score */}
                    <h2 className="score">
                        Total:{" "}
                        <animated.span>
                            {animatedMoonScore.value.to((val) => Math.floor(val))}
                        </animated.span>{" "}
                        Points
                    </h2>
                    <button className="button moon-button" onClick={() => incrementScore("moon")}>
                        +1 Moon
                    </button>
                    <h3 className="my-score">You've scored {myMoonScore} for the moon</h3>
                    <h4 className="points-per-sec">{moonPointsPerSec} Points per second</h4>
                </motion.div>
            </div>

            <p className="footer">
                Made with ❤️ by{" "}
                <a
                    href="https://github.com/AswinAsok"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link"
                >
                    Kuttycoder Aswin
                </a>
            </p>
        </div>
    );
}
