package com.conlect.oatos.dto.autobean;

import com.conlect.oatos.dto.client.ShareFileNewMessageDTO.Operation;

public interface IShareFolderAndFileUpdateDTO extends IShareFolderAndFileDTO {

	Operation getOperation();

	void setOperation(Operation operation);

	String getComment();

	void setComment(String comment);

	String getUserName();

	void setUserName(String userName);
}
