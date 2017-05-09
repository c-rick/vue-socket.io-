export default {
  convertCanvasToImage: (canvas) => {
    // 新Image对象，可以理解为DOM
    let image = new Image();
    // canvas.toDataURL 返回的是一串Base64编码的URL，当然,浏览器自己肯定支持
    // 指定格式 PNG
    image.src = canvas.toDataURL('image/png');
    return image;
  }
}
