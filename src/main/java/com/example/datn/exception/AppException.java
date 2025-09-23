package com.example.datn.exception;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data

@NoArgsConstructor
public class AppException extends RuntimeException{
     private ErrorCode errorCode;

     public AppException(ErrorCode errorCode) {
          super(errorCode.getErrorMessage());
          this.errorCode = errorCode;
     }

     public AppException(ErrorCode errorCode, String customMessage) {
          super(customMessage);
          this.errorCode = errorCode;
     }
}
