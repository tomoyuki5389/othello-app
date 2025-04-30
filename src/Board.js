// 状態管理：「useState」は状態を保持するためのReactのフック
import React, { useState, useEffect, useCallback, useMemo } from "react";
import "./index.css";
import Stone from "./Stone";

const BOARD_SIZE = 8;

// 初期盤面の作成
// 8×8の2次元配列を作る（最初は全マスがnullとなる）
const createInitialBoard = () => {
    const board = Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill(null));

    // 初期配置（中央4マス）
    board[3][3] = "white";
    board[3][4] = "black";
    board[4][3] = "black";
    board[4][4] = "white";

    return board;
}

function Board() {

    // ステートにセットする
    // board：現在の盤面（2次元配列）
    // setBoard：盤面を更新する関数（次ステップで使います）
    const [board, setBoard] = useState(createInitialBoard());
    const [currentPlayer, setCurrentPlayer] = useState("black");
    const [gameOver, setGameOver] = useState(false);
    const [history, setHistory] = useState([]);
    const [validMoves, setValidMoves] = useState([]);
    const [flippingStones, setFlippingStones] = useState([]);
    const [turnChanged, setTurnChanged] = useState(false);
    const [passMessage, setPassMessage] = useState("");

    const directions = useMemo(() => [
        [-1, 0], [1, 0], [0, -1], [0, 1],   // 上下左右
        [-1, -1], [-1, 1], [1, -1], [1, 1]  //　斜め
    ], []);
    
    const countStones = useCallback(() => {
        let black = 0, white = 0;

        for (let row of board) {
            for (let cell of row) {
                if (cell === "black") black++;
                if (cell === "white") white++;
            }
        }

        return { black, white };
    }, [board]);

    // 石を挟めるかチェックする関数
    const canPlaceStone = useCallback((row, col, player) => {
        const opponent = player === "black" ? "white" : "black";
    
        // すでに石があるなら置けない
        if (board[row][col] !== null) return false;
    
        // 8方向すべて確認する
        for (const [dx, dy] of directions) {
            let x = row + dx;
            let y = col + dy;
            let hasOpponentBetween = false;
    
            // 盤の中を移動しながらチェック
            while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
                if (board[x][y] === opponent) {
                    // 相手の石ならさらに進む
                    hasOpponentBetween = true;
                } else if (board[x][y] === player) {
                    // 自分の石にたどり着いたら、間に相手がいればOK
                    if (hasOpponentBetween) return true;
                    break;
                } else {
                    // 空白マスなら終了
                    break;
                }
                x += dx;
                y += dy;
            }
        }
        // どの方向でも挟めなかったら置けない
        return false;
    }, [board, directions]);

    const flipStones = (newBoard, row, col, player) => {
        const opponent = player === "black" ? "white" : "black";
        const flipped =[];

        for (const [dx, dy] of directions) {
            const stonesToFlip = [];
            let x = row + dx;
            let y = col + dy;

            while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
                if (newBoard[x][y] === opponent) {
                    stonesToFlip.push([x, y]);
                } else if (newBoard[x][y] === player) {
                    // 自分の石に到達したら、その間の相手の石を裏返す
                    for (const [fx, fy] of stonesToFlip) {
                        newBoard[fx][fy] = player;
                        flipped.push([fx, fy]);
                    }
                    break;
                } else {
                    // 空白または盤上ならダメ
                    break;
                }
                x += dx;
                y += dy;
            }
        }

        return flipped;
    };

    const hasValidMove = useCallback((player) => {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (canPlaceStone(row, col, player)) return true;
            }
        }

        return false;
    }, [canPlaceStone]);

    const handleClick = (row, col) => {
        // 石が置けるかチェック
        if (!canPlaceStone(row, col, currentPlayer)) return;

        // 新しい盤面を作って石を置く
        const newBoard = board.map((r) => r.slice());
        newBoard[row][col] = currentPlayer;

        const flipped = flipStones(newBoard, row, col, currentPlayer); // 石を裏返す処理（flipStones(newBoard, row, col, currentPlayer);）        
        setBoard(newBoard);
        setFlippingStones(flipped) // 裏返った石を記録

        setTimeout(() => setFlippingStones([]), 600); // 0.6秒後に消す（アニメーション終了）

        const nextPlayer = currentPlayer === "black" ? "white" : "black";

        if (hasValidMove(nextPlayer)) {
            setCurrentPlayer(nextPlayer);
        } else if(hasValidMove(currentPlayer)) {
            setPassMessage("相手は置けないので、あなたのターンが続きます");
            setTimeout(() => setPassMessage(""), 3000); // 3秒で消える
        } else {
            setGameOver(true);
            const { black, white } = countStones();
            setHistory(prev => [
                ...prev,
                { black, white, winner: black > white ? '黒' : white > black ? '白' : '引き分け' }
            ]);
        }
    };

    useEffect(() => {
        // const blackCan = hasValidMove('black');
        // const whiteCan = hasValidMove('white');
        const noValidMove = !hasValidMove('black') && !hasValidMove('white');
        const boardFull = board.flat().every(cell => cell !== null);

        if ((noValidMove || boardFull) && !gameOver) {
                setGameOver(true);

                // スコアを履歴に追加
                const { black, white } = countStones();
                setHistory(prev => [
                    ...prev,
                    { black, white, winner: black > white ? '黒' : white > black ? '白' : '引き分け' }
                ]);
        }
    }, [board, hasValidMove, countStones, gameOver]);

    useEffect (() => {
        const moves = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (canPlaceStone(row, col, currentPlayer)) {
                    moves.push([row, col]);
                }
            }
        }
        setValidMoves(moves);
    }, [board, currentPlayer, canPlaceStone]);

    useEffect(() => {
        setTurnChanged(true);
        const timeout = setTimeout(() => setTurnChanged(false), 400); // 0.4秒で戻す
        return () => clearTimeout(timeout); 
    }, [currentPlayer]);

    useEffect(() => {
        if (gameOver) return;

        const currentCanMove = hasValidMove(currentPlayer);
        const nextPlayer = currentPlayer === "black" ? "white" : "black";
        const nextCanMove = hasValidMove(nextPlayer);

        if (!currentCanMove && nextCanMove) {
            setPassMessage("あなたは置けないので、相手のターンになります");
            setTimeout(() => setPassMessage(""), 3000);
            setCurrentPlayer(nextPlayer);
        } else if (!currentCanMove && !nextCanMove) {
            setGameOver(true);
            const { black, white } = countStones();
            setHistory(prev => [
                ...prev,
                { black, white, winner: black > white ? '黒' : white > black ? '白' : '引き分け' }
            ]);
        }
    }, [board, currentPlayer, gameOver, hasValidMove, countStones]);

    const handleRestart = () => {
        setBoard(createInitialBoard());
        setCurrentPlayer("black");
        setGameOver(false);
        setValidMoves([]);
        setFlippingStones([]);
        setPassMessage("");
    };

    const renderSquares = () => {
        const squares = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const stone = board[row][col]; // "white" or "black" or null
                const isValid = validMoves.some(([r, c]) => r === row && c === col);
                const isFlipping = flippingStones.some(([r, c]) => r === row && c === col);
                
                squares.push(
                    <div 
                        key={`${row}-${col}`} 
                        className="square"
                        onClick={() => handleClick(row, col)}
                    >
                        {isValid && <div className="hint-circle"></div>}
                        <Stone color={stone} isFlipping={isFlipping} />
                    </div>
                );
            }
        }
        return squares;
    };

    if (gameOver) {
        const { black, white } = countStones();
        return (
            <div className="result">
                <h2>ゲーム終了</h2>
                <p>黒：{black} 石</p>
                <p>白：{white} 石</p>
                <h3>
                    {black >white
                        ? "黒の勝ち！"
                        : white > black
                        ? "白の勝ち！"
                        : "引き分け！"
                    }
                </h3>
                <button className="restart-button" onClick={handleRestart}>
                    リスタート
                </button>
            </div>
        );
    }

    return ( 
        <div className={`current-player ${turnChanged ? 'turn-change' : ''}`}>
            <p>現在のプレイヤー：{currentPlayer === "black" ? "黒" : "白"}</p>

            {passMessage && (
                <div className="pass-toast">
                    {passMessage}
                </div>
            )}

        <div className="board">{renderSquares()}</div>

            {history.length > 0 && (
                <div>
                    <h2>スコア履歴</h2>
                    <ul>
                        {history.map((record, index) => (
                            <li key={index}>
                                {index +1}回目：　黒{record.black} 石 vs 白 {record.white} 石 → {record.winner}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default Board;