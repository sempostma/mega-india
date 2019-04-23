import { firebaseReady } from "./authentication";
import AuthStore from "../stores/AuthStore";
import defaultAvatar from '../images/img_avatar.png';

export const getProfileImage = async userUid => {
    const firebase = await firebaseReady;
    try {
        const ref = await firebase.storage().ref('/users/' + userUid + '/profile-picture.jpg')
        const url = await ref.getDownloadURL();
        return url;
    } catch (err) {
        // most likely 404.
        // resolve this with the default avatar url
        return defaultAvatar;
    }
}


/**
 * @callback onProgress
 * @param {number} progress - Progress in percentages
 * @param {number} bytesTransferred
 * @param {number} totalBytes
 */

/**
 * @param {string} uid - User's firebase uid
 * @param {File} file - the avatar image file to upload
 * @param {string} contentType - The content type of the image e.g: 'image/jpeg'
 * @param {onProgress} onProgress - Gets called every time the profile image upload progresses
 */
export const uploadProfilePicture = (userUid, file, onProgress) => {
    return new Promise((resolve, reject) => {
        firebaseReady.then(firebase => {

            const ref = firebase.storage().ref(`/users/${userUid}/profile-picture.jpg`)
            const uploadTask = ref.put(file, { contentType: 'image/jpeg' });
            uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
                function (snapshot) {
                    // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                    if (onProgress) onProgress(progress, snapshot.bytesTransferred, snapshot.totalBytes);
                }, function (error) {
                    reject(error);
                }, function () {
                    uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
                        resolve(downloadURL);
                        AuthStore.setPhotoURL(downloadURL);
                        console.log('File available at', downloadURL);
                    });
                });
        });
    });
};

export const getDisplayName = () => {
    const authStoreUserDataDisplayName = AuthStore.userData
        && AuthStore.userData.public
        && AuthStore.userData.public.displayName;
    const userAuthDisplayName = (!AuthStore.user
        || AuthStore.user.displayName === undefined
        || AuthStore.user.displayName === null) === false
        && AuthStore.user.displayName;

    return authStoreUserDataDisplayName || userAuthDisplayName || 'Anonymous';
}

