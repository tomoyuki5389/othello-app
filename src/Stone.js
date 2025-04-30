import React from "react";

function Stone({color, isFlipping}) {
    if (!color) return null;

    return (
        <div className={`stone ${color} ${isFlipping ? "flipping" : ""}`}>
        </div>
    );
}

export default Stone;