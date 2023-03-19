import formidable from 'formidable';

const formParser = folder => {
  return formidable({
    multiples: true,
    keepExtensions: true,
    allowEmptyFiles: false,
    maxFileSize: 5 * 1024 * 1024,
    uploadDir: `F:\\Full Stack Development\\iNeuron course\\Live Classes\\E-commerce App\\uploads\\${folder}`,
    filter: ({ mimetype }) => mimetype && mimetype.includes('image'),
  });
};

export default formParser;
