import { floor, size } from "lodash";
import { useState, useRef, useCallback, useEffect, MutableRefObject } from "react";
import IGridProps from "../Models/IGridProps";
import useWindowSize from "./useWindowSize";

export interface IAutoFillProps {
    listRef: MutableRefObject<HTMLDivElement | null>;
}

export interface IAutoFill {
    width: number;
    height: number;
    columnWidth: number;
    columnCount: number;
    gridProps: IGridProps;
    autoFillRef: (r: HTMLDivElement | undefined | null, force?: boolean) => void;
}

export default function useAutoFill<T>(data: T[] ) {
    const [called, setCalled] = useState<boolean>(false);
    const listRef = useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = useState<number>(0);
    const [height, setHeight] = useState<number>(0);
    const [columnWidth, setColumnWidth] = useState<number>(190);
    const [columnCount, setColumnCount] = useState<number>(190);
    const [gridProps, setGridProps] = useState<IGridProps>({
        className: "scrollable",
        columnCount: 2,
        columnWidth: 100,
        rowCount: 2,
        rowHeight: 100,
        height: height,
        width: width,
    });
    const autoFillRef = useCallback((r: HTMLDivElement | undefined | null, force?: boolean) => {
        console.log("called");
        if (!r || called && !force)
            return;
        listRef.current = r;
        setWidth(r.clientWidth);
        setHeight(r.clientHeight);
        // -10 cause of scrollbar width
        const width = r.clientWidth - 11;
        const height = r.clientHeight;
        // Calculate how many columns we'll have
        let columns = floor(width / 180);
        // Calculate exactly how many pixels per column
        let w = 180 + floor(width % 180 / columns);
        let h = 250;
        if (width < (185 * 2)) {
            columns = 2;
            // width / 2 minus 10 pixels
            w = floor(width / 2 - 10);
            h = w + 50;
        }
        const rowCount = Math.ceil(data.length / columns);
        console.log("rows", rowCount);
        setColumnCount(columns);
        setColumnWidth(w);
        setGridProps({
            className: "scrollable",
            columnCount: columns,
            columnWidth: w,
            rowCount: rowCount,
            rowHeight: h,
            height: height,
            width: width,
        });
    }, [setCalled, setWidth, setHeight, data, setColumnWidth, setGridProps]);
    const size = useWindowSize();
    useEffect(() => {
        autoFillRef(listRef.current, true);
    }, [size]);

    return {width, height, gridProps, columnWidth, autoFillRef, columnCount}
}