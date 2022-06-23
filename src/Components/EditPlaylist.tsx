import { Toast } from "@capacitor/toast";
import { faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";
import { IPlaylist } from "../Models/API/Responses/IPlaylistsResponse";
import VLC from "../Plugins/VLC";
import DraggableList from "./DraggableList";
import Loading from "./Loading";

interface IPlaylistFormData {
    name: string;
    comment: string;
    public: boolean;
}

export default function EditPlaylist() {
    const { state }: any = useLocation();
    const { register, setValue, handleSubmit } = useForm<IPlaylistFormData>();
    const [formVisible, setFormVisible] = useState<boolean>(false);
    const hash = async (data: IPlaylistFormData) => {
        console.log(playlist);
        console.log({ ...playlist, ...data });
        const ret = await VLC.updatePlaylist({
            playlist: { ...playlist!, ...data },
        });
        if (ret.status === "ok") {
            Toast.show({ text: "Playlist saved correctly" });
        } else {
            Toast.show({ text: ret.error });
        }
    };
    const [playlist, setPlaylist] = useState<IPlaylist>();
    const refreshPlaylist = useCallback(async () => {
        const ret =
            state.id === "current"
                ? await VLC.getCurrentPlaylist()
                : await VLC.getPlaylist({ id: state.id });
        if (ret.status === "ok") {
            setPlaylist(ret.value!!);
            setValue("name", ret.value!.name);
            setValue("comment", ret.value!.comment);
            setValue("public", ret.value!.public);
        }
    }, [setValue, state.id]);

    useEffect(() => {
        refreshPlaylist();
    }, [refreshPlaylist, state]);

    if (!playlist) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center h-100 w-100">
                <Loading></Loading>
            </div>
        );
    }
    return (
        <div className="playlist-container d-flex flex-column w-100 ">
            <div className="d-flex flex-row align-items-center justify-content-between w-100">
                <div className="section-header text-white">
                    Editing playlist
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleSubmit(hash,() => {console.log("onerror")})}
                >
                    Save
                </button>
            </div>
            <hr className="w-100 text-white mt-1"></hr>
            <div className="d-flex flex-row align-items-start justify-content-end w-100">
                <form
                    className={classNames(
                        "w-100",
                        formVisible ? "d-block" : "d-none"
                    )}
                    style={{ transition: "0.5 ease" }}
                >
                    <div className="d-flex flex-column align-items-center justify-content-start h-100">
                        <div className="w-100 text-start">
                            <label htmlFor="name" className="text-white">
                                Name
                            </label>
                        </div>
                        <input
                            {...register("name")}
                            className="form-control"
                            id="name"
                        />
                        <div className="w-100 text-start mt-2">
                            <label htmlFor="name" className="text-white">
                                Comment
                            </label>
                        </div>
                        <input
                            {...register("comment")}
                            className="form-control"
                            id="name"
                        />
                        <div className="form-check form-switch w-100 text-start mt-2">
                            <input
                                {...register("public")}
                                className="form-check-input"
                                type="checkbox"
                                id="flexSwitchCheckDefault"
                            />
                            <label className="w-100 text-start form-label text-white">
                                Public
                            </label>
                        </div>
                    </div>
                </form>
                <div className="text-end">
                    <button
                        className="btn btn-link text-white"
                        onClick={() => {
                            setFormVisible(!formVisible);
                        }}
                    >
                        {formVisible ? (
                            <FontAwesomeIcon
                                icon={faArrowDown}
                                rotation={180}
                            />
                        ) : (
                            <FontAwesomeIcon icon={faArrowDown} />
                        )}
                    </button>
                </div>
            </div>
            <div className="h-100 w-100 overflow-scroll scrollable mt-2">
                <DraggableList playlist={playlist}></DraggableList>
            </div>
        </div>
    );
}
