/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

// type is either 'data' or 'password'
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword'
        : 'http://127.0.0.1:3000/api/v1/users/updateMe';
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });
    console.log(res);
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`);

      if (type === 'photo') {
        return res.data.data.user.photo;
      }
    }
  } catch (err) {
    console.log(err);
    showAlert('error', err.response.data.message);
  }
};
