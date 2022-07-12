import { faBars, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDrag } from "@use-gesture/react";
import classNames from "classnames";
import { clamp } from "lodash";
import { useRef, useState } from "react";
import { IPlaylist } from "../Models/API/Responses/IPlaylistsResponse";
import { PlaylistEntry } from "./PlaylistEntry";
import "./DraggableList.scss";
import useWindowSize from "../Hooks/useWindowSize";
import { CurrentTrackContextDefValue } from "../AudioContext";

const swapArrayLocs = (arr: any, index1: any, index2: any) => {
    if (index1 < index2) {
        const max = index2;
        index2 = index1 + 1;
        while (index2 <= max) {
            [arr[index1], arr[index2]] = [arr[index2], arr[index1]];
            index2++;
            index1++;
        }
    } else {
        const min = index2;
        index2 = index1 - 1;
        while (index2 >= min) {
            [arr[index1], arr[index2]] = [arr[index2], arr[index1]];
            index2--;
            index1--;
        }
    }
};

export default function DraggableList({ playlist }: { playlist: IPlaylist }) {
    const [y, setY] = useState<number>(0);
    const [activeI, setActiveI] = useState<number>(-1);
    const [currentI, setCurrentI] = useState<number>(-1);
    const [dragging, setDragging] = useState<boolean>(false);
    const [hovering, setHovering] = useState<boolean>(false);
    const size = useWindowSize();
    const tacho = useRef<HTMLDivElement | null>(null);
    const list = useRef<HTMLDivElement | null>(null);
    const bind = useDrag(
        ({ args: [originalIndex], active, event, movement: [, y], xy }) => {
            setDragging(true);
            const curIndex = originalIndex;
            const curRow = clamp(
                Math.round((curIndex * 68 + y) / 68),
                0,
                playlist.entry.length - 1
            );
            setCurrentI(curRow);

            if (
                tacho.current &&
                xy[0] >= tacho.current!.getBoundingClientRect().left &&
                xy[0] <= tacho.current!.getBoundingClientRect().right &&
                xy[1] >= tacho.current!.getBoundingClientRect().top &&
                xy[1] <= tacho.current!.getBoundingClientRect().bottom
            ) {
                setHovering(true);
            } else {
                setHovering(false);
            }

            setY(y);
            setActiveI(originalIndex);
            if (!active) {
                if (!hovering) {
                    swapArrayLocs(playlist.entry, curIndex, curRow);
                } else {
                    remove(curIndex);
                }
                setY(0);
                setActiveI(-1);
                setCurrentI(-1);
                setDragging(false);
            }
        }
    );

    const remove = (index: number) => {
        playlist.entry.splice(index, 1);
    };

    return (
        <div ref={list} id="draggable-list h-100">
            <div
                className={classNames(
                    "cancel",
                    "not-selectable",
                    hovering ? "cancel-hover" : "",
                    dragging ? "d-block" : "d-none"
                )}
                ref={tacho}
                style={{
                    left: size[0] * 0.35,
                    top: size[1] * 0.1,
                }}
            >
                <div className="d-flex flex-column align-items-center justify-content-center w-100 h-100">
                    <FontAwesomeIcon
                        icon={faTrash}
                        style={{ color: "white" }}
                        size="2x"
                    ></FontAwesomeIcon>
                    <span className="text-white">Remove</span>
                </div>
            </div>
            {playlist.entry.map((item, i) => (
                <div
                    key={i}
                    style={{
                        transform:
                            i === activeI
                                ? `translateY(${y}px) scaleX(0.95)`
                                : "",
                        zIndex: i === activeI ? 100000000 : 0,
                        position: i === activeI ? "relative" : "inherit",
                        transition: "0.1s ease",
                    }}
                    children={
                        <div className="d-flex flex-row align-items-center justify-content-center w-100">
                            <PlaylistEntry
                                item={playlist.entry[i]}
                                currentTrack={
                                    currentI > 0
                                        ? playlist.entry[currentI]
                                        : CurrentTrackContextDefValue
                                }
                                state={undefined}
                                playlist={playlist}
                                refreshPlaylist={() => {}}
                                actionable={false}
                                style={{ width: "100%" }}
                            ></PlaylistEntry>
                            <div
                                {...bind(i)}
                                className="text-white"
                                style={{
                                    touchAction: "none",
                                    width: "68px",
                                }}
                            >
                                <FontAwesomeIcon icon={faBars} size="2x" />
                            </div>
                        </div>
                    }
                />
            ))}
        </div>
    );
}
