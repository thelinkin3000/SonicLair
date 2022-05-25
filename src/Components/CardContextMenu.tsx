import classnames from "classnames";
import { IMenuContext } from "../AppContext";
import "./CardContextMenu.scss";

export default function CardContextMenu({ body, show, x, y }: IMenuContext) {
    return (<div
        className={classnames(show ? "d-block" : "d-none","context-menu","text-white")}
        style={{ top: y, left: x, }} >
        {body}

    </div>)
}