import React, { useState } from 'react';
import './ReceiptPreview.css';

function ReceiptPreview({ receipt, imagePath, onClose }) {
  const [imageError, setImageError] = useState(false);

  if (!receipt && !imagePath) return null;

  const handleClose = () => {
    setImageError(false); // Reset image error state
    onClose();
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="receipt-preview-overlay" onClick={handleClose}>
      <div className="receipt-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-preview-header">
          <h3>{receipt ? receipt.receipt_name : 'Receipt Preview'}</h3>
          <button className="receipt-preview-close" onClick={handleClose}>×</button>
        </div>

        <div className="receipt-preview-content">
          {receipt && (
            <div className="receipt-info">
              <p><strong>Store:</strong> {receipt.store_name}</p>
              <p><strong>Total:</strong> ${receipt.total_cost}</p>
              <p><strong>Date:</strong> {new Date(receipt.upload_date).toLocaleDateString()}</p>
              <p><strong>Uploaded by:</strong> {receipt.uploaded_by}</p>
              {receipt.notes && <p><strong>Notes:</strong> {receipt.notes}</p>}
            </div>
          )}

          <div className="receipt-image-container">
            {!imageError ? (
              <img
                src={imagePath || `/${receipt.file_name}`}
                alt={receipt ? receipt.receipt_name : 'Receipt'}
                className="receipt-image"
                onError={handleImageError}
              />
            ) : (
              <div className="receipt-image-error">
                <p>📄</p>
                <p>Receipt image not available</p>
                <p className="file-path">{imagePath || receipt.file_name}</p>
                <p className="debug-info">Tried to load: {imagePath || `/${receipt.file_name}`}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReceiptPreview;