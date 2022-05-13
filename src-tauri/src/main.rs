#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

extern crate vlc_static;
use vlc_static::{Instance, Media, MediaPlayer};
use std::thread;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![my_custom_command])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn my_custom_command(invoke_message: String) {
    println!("I was invoked from JS! {invoke_message}");
    // Create an instance
    let instance = Instance::new().unwrap();
    // Create a media from a file
    let md = Media::new_path(&instance, invoke_message).unwrap();
    // Create a media player
    let mdp = MediaPlayer::new(&instance).unwrap();
    mdp.set_media(&md);

    // Start playing
    mdp.play().unwrap();

    // Wait for 10 seconds
    thread::sleep(::std::time::Duration::from_secs(10));
}
