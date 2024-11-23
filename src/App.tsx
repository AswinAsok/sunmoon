import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Define the shape of the game scores
interface GameScore {
    name: string;
    score: number;
}

export default function SunVsMoon() {
    const [sunScore, setSunScore] = useState<number>(0);
    const [moonScore, setMoonScore] = useState<number>(0);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string;

    const supabase = createClient(supabaseUrl, supabaseKey);

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
            .channel("public:game_scores")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "game_scores" },
                (payload: { new: GameScore }) => {
                    if (payload.new.name === "sun") setSunScore(payload.new.score);
                    if (payload.new.name === "moon") setMoonScore(payload.new.score);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const incrementScore = async (name: "sun" | "moon") => {
        const { error } = await supabase.rpc("increment_score", { input_name: name });
        if (error) {
            console.error("Error:", error.message);
        } else {
            console.log(`${name} score incremented successfully.`);
        }
    };

    return (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "20px" }}>
            {/* Sun Section */}
            <div style={{ textAlign: "center" }}>
                <h1>Sun</h1>
                <h2>{sunScore}</h2>
                <button
                    onClick={() => incrementScore("sun")}
                    style={{ padding: "10px 20px", fontSize: "16px" }}
                >
                    +1 Sun
                </button>
            </div>

            {/* Moon Section */}
            <div style={{ textAlign: "center" }}>
                <h1>Moon</h1>
                <h2>{moonScore}</h2>
                <button
                    onClick={() => incrementScore("moon")}
                    style={{ padding: "10px 20px", fontSize: "16px" }}
                >
                    +1 Moon
                </button>
            </div>
        </div>
    );
}
