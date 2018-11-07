/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import ts from 'typescript';

import {DEFAULT_ARRAY_RANGE, FIXED_ARRAY_COUNT} from '../../lib/constants';
import {defaultTypeToMock} from '../../lib/default-type-to-mock';
import {fake} from '../../lib/fake';
import {randomRange} from '../../lib/random-range';
import {smartProps} from '../../lib/smart-props';
import {stringify} from '../../lib/stringify';
import {FileTuple, FileTuples} from '../../lib/types';

export interface Options {
  files?: FileTuples;
  language?: string;
  interfaces?: string[];
  isFixedMode?: boolean;
  useJson?: boolean;
  isOptionalAlwaysEnabled?: boolean;
}

interface JSDoc {
  comment: string;
}

interface NodeWithDocs extends ts.PropertySignature {
  jsDoc: JSDoc[];
}

type TypeCacheRecord = {
  kind: ts.SyntaxKind,
  aliasedTo: ts.SyntaxKind
};

type Output = Record<string, {}>;

const types: Record<string, {}> = {};


function generatePrimitive(
    property: string, syntaxType: ts.SyntaxKind, options: Options,
    mockType?: string) {
  const smartMockType = smartProps[property];
  const isFixedMode = options.isFixedMode ? options.isFixedMode : false;

  if (mockType) {
    return fake(mockType, options.isFixedMode);
  } else if (smartMockType) {
    return fake(smartMockType, options.isFixedMode);
  } else {
    return defaultTypeToMock[syntaxType](isFixedMode);
  }
}

function isQuestionToken(
    questionToken: ts.Token<ts.SyntaxKind.QuestionToken>|undefined,
    options: Options) {
  if (questionToken) {
    if (options.isFixedMode && !options.isOptionalAlwaysEnabled) {
      return true;
    }

    else if (Math.random() < .5 && !options.isOptionalAlwaysEnabled) {
      return true;
    }
  }

  return false;
}

function processGenericPropertyType(
    output: Output, property: string, kind: ts.SyntaxKind, mockType: string,
    options: Options) {
  const mock = generatePrimitive(property, kind, options, mockType);
  output[property] = mock;
}

function processFunctionPropertyType(
    node: ts.PropertySignature, output: Output, property: string,
    typeName: string, kind: ts.SyntaxKind, sourceFile: ts.SourceFile,
    options: Options) {
  // TODO process args from parameters of function
  const args = '';
  let body = '';

  const funcNode = node.type as ts.FunctionTypeNode;
  const returnType = funcNode.type;

  switch (returnType.kind) {
    case ts.SyntaxKind.TypeReference:
      const tempBody: Record<string, {}> = {};
      processPropertyTypeReference(
          node, tempBody, 'body',
          ((returnType as ts.TypeReferenceNode).typeName as ts.Identifier).text,
          returnType.kind, sourceFile, options);

      body = `return ${stringify(tempBody['body'])}`;
      break;
    default:
      body = `return ${
          JSON.stringify(generatePrimitive('', returnType.kind, options))}`;
      break;
  }

  const func = new Function(args, body);
  output[property] = func;
}

function processPropertyTypeReference(
    node: ts.PropertySignature, output: Output, property: string,
    typeName: string, kind: ts.SyntaxKind, sourceFile: ts.SourceFile,
    options: Options) {
  let normalizedTypeName;

  if (typeName.startsWith('Array<')) {
    normalizedTypeName = typeName.replace('Array<', '').replace('>', '');
  } else {
    normalizedTypeName = typeName;
  }

  if (normalizedTypeName !== typeName) {
    processArrayPropertyType(
        node, output, property, normalizedTypeName, kind, sourceFile, options);
    return;
  }

  switch ((types[normalizedTypeName] as TypeCacheRecord).kind) {
    case ts.SyntaxKind.EnumDeclaration:
      setEnum(sourceFile, node, output, typeName, property);
      break;
    default:
      if ((types[normalizedTypeName] as TypeCacheRecord).kind !==
          (types[normalizedTypeName] as TypeCacheRecord).aliasedTo) {
        const alias = (types[normalizedTypeName] as TypeCacheRecord).aliasedTo;
        const isPrimitiveType = alias === ts.SyntaxKind.StringKeyword ||
            alias === ts.SyntaxKind.NumberKeyword ||
            alias === ts.SyntaxKind.BooleanKeyword;

        if (isPrimitiveType) {
          output[property] = generatePrimitive(property, alias, options, '');
        } else {
          // TODO
        }
      } else {
        output[property] = {};
        processFile(sourceFile, output[property], options, typeName);
        break;
      }
  }
}

function processJsDocs(
    node: ts.PropertySignature, output: Output, property: string,
    jsDocs: JSDoc[], options: Options) {
  // TODO handle case where we get multiple mock JSDocs or a JSDoc like
  // mockRange for an array. In essence, we are only dealing with
  // primitives now

  // TODO Handle error case where a complex type has MockDocs

  let mockType = '';
  let jsDocComment = '';

  if (jsDocs.length > 0 && jsDocs[0].comment) {
    jsDocComment = jsDocs[0].comment;
  }

  if (jsDocComment.startsWith('!mockType')) {
    const match = jsDocComment.match(/(?<=\{).+?(?=\})/g);
    if (match) {
      mockType = match[0];
    }
  } else {
    // TODO
  }

  const mock = generatePrimitive(property, node.kind, options, mockType);
  output[property] = mock;
}

function processArrayPropertyType(
    node: ts.PropertySignature, output: Output, property: string,
    typeName: string, kind: ts.SyntaxKind, sourceFile: ts.SourceFile,
    options: Options) {
  typeName = typeName.replace('[', '').replace(']', '');
  output[property] = [];

  if ((node.type as ts.ArrayTypeNode).elementType) {
    kind = (node.type as ts.ArrayTypeNode).elementType.kind;
  }

  const isPrimitiveType = kind === ts.SyntaxKind.StringKeyword ||
      kind === ts.SyntaxKind.BooleanKeyword ||
      kind === ts.SyntaxKind.NumberKeyword;

  const arrayRange = options.isFixedMode ?
      FIXED_ARRAY_COUNT :
      randomRange(DEFAULT_ARRAY_RANGE[0], DEFAULT_ARRAY_RANGE[1]);

  for (let i = 0; i < arrayRange; i++) {
    if (isPrimitiveType) {
      (output[property] as Array<{}>)[i] =
          generatePrimitive(property, kind, options, '');
    } else {
      (output[property] as Array<{}>).push({});
      processFile(
          sourceFile, (output[property] as Array<{}>)[i], options, typeName);
    }
  }
}

function traverseInterfaceMembers(
    node: ts.Node, output: Output, sourceFile: ts.SourceFile,
    options: Options) {
  if (node.kind !== ts.SyntaxKind.PropertySignature) {
    return;
  }

  const processPropertySignature = (node: ts.PropertySignature) => {
    let jsDocs: JSDoc[] = [];

    if ((node as NodeWithDocs).jsDoc) {
      jsDocs = (node as NodeWithDocs).jsDoc;
    }

    const property = node.name.getText();
    const questionToken = node.questionToken;

    let typeName = '';
    let kind;

    if (isQuestionToken(questionToken, options)) {
      return;
    }

    if (jsDocs.length > 0) {
      processJsDocs(node, output, property, jsDocs, options);
      return;
    }

    if (node.type) {
      kind = node.type.kind;
      typeName = node.type.getText();
    }

    switch (kind) {
      case ts.SyntaxKind.TypeReference:
        processPropertyTypeReference(
            node, output, property, typeName, kind as ts.SyntaxKind, sourceFile,
            options);
        break;
      case ts.SyntaxKind.ArrayType:
        processArrayPropertyType(
            node, output, property, typeName, kind as ts.SyntaxKind, sourceFile,
            options);
        break;
      case ts.SyntaxKind.FunctionType:
        processFunctionPropertyType(
            node, output, property, typeName, kind as ts.SyntaxKind, sourceFile,
            options);
        break;
      default:
        processGenericPropertyType(
            output, property, kind as ts.SyntaxKind, '', options);
        break;
    }
  };

  processPropertySignature(node as ts.PropertySignature);
}

function setEnum(
    sourceFile: ts.SourceFile, node: ts.Node, output: Output, typeName: string,
    property: string) {
  const processNode = (node: ts.Node) => {
    switch (node.kind) {
      case ts.SyntaxKind.EnumDeclaration:
        if ((node as ts.EnumDeclaration).name.text === typeName) {
          const members = (node as ts.EnumDeclaration).members;
          const selectedMemberIdx = Math.floor(members.length / 2);
          const selectedMember = members[selectedMemberIdx];

          // TODO handle bitwise initializers
          if (selectedMember.initializer) {
            switch (selectedMember.initializer.kind) {
              case ts.SyntaxKind.NumericLiteral:
                output[property] = Number(selectedMember.initializer.getText());
                break;
              case ts.SyntaxKind.StringLiteral:
                output[property] =
                    selectedMember.initializer.getText().replace(/\'/g, '');
                break;
              default:
                break;
            }
          } else {
            output[property] = selectedMemberIdx;
          }
        }
        break;
      default:
        break;
    }

    ts.forEachChild(node, processNode);
  };

  processNode(sourceFile);
}

function traverseInterface(
    node: ts.Node, output: Output, sourceFile: ts.SourceFile, options: Options,
    propToTraverse?: string, path?: string) {
  if (path) {
    output[path] = {};
    output = output[path];
  }

  if (!propToTraverse && !path) {
    const newPath = (node as ts.InterfaceDeclaration).name.text;
    output[newPath] = {};
    output = output[newPath];
  }

  // TODO get range from JSDoc
  // TODO given a range of interfaces to generate, add to array. If 1
  // then just return an object
  node.forEachChild(
      child => traverseInterfaceMembers(child, output, sourceFile, options));
}

function isSpecificInterface(name: string, options: Options) {
  if (!options.interfaces) {
    return true;
  }

  if (options.interfaces.indexOf(name) === -1) {
    return false;
  }

  return true;
}

function processFile(
    sourceFile: ts.SourceFile, output: Output, options: Options,
    propToTraverse?: string) {
  const processNode = (node: ts.Node) => {
    switch (node.kind) {
      case ts.SyntaxKind.InterfaceDeclaration:
        /**
         * TODO: Handle interfaces that extend others, via checking hertiage
         * clauses
         */
        const p = (node as ts.InterfaceDeclaration).name.text;
        if (!isSpecificInterface(p, options) && !propToTraverse) {
          return;
        }
        if (propToTraverse) {
          if (p === propToTraverse) {
            traverseInterface(
                node, output, sourceFile, options, propToTraverse);
          }
        } else {
          traverseInterface(node, output, sourceFile, options);
        }
        break;
      case ts.SyntaxKind.TypeAliasDeclaration:
        const type = (node as ts.TypeAliasDeclaration).type;
        const path = (node as ts.TypeAliasDeclaration).name.text;

        if (!isSpecificInterface(path, options)) {
          return;
        }

        if (propToTraverse) {
          if (path === propToTraverse) {
            traverseInterface(
                type, output, sourceFile, options, propToTraverse);
          }
        } else {
          traverseInterface(type, output, sourceFile, options, undefined, path);
        }
        break;

      default:
        break;
    }

    ts.forEachChild(node, processNode);
  };

  processNode(sourceFile);
}

function gatherTypes(sourceFile: ts.SourceFile) {
  const processNode = (node: ts.Node) => {
    const name = (node as ts.DeclarationStatement).name;
    const text = name ? name.text : '';
    let aliasedTo;

    if ((node as ts.TypeAliasDeclaration).type) {
      aliasedTo = (node as ts.TypeAliasDeclaration).type.kind;
    } else {
      aliasedTo = node.kind;
    }

    types[text] = {kind: node.kind, aliasedTo};

    ts.forEachChild(node, processNode);
  };

  processNode(sourceFile);
}

export function mock(options: Options) {
  const output: Output = {};
  const fileContents = options.files;

  if (!fileContents) {
    return {};
  }

  fileContents.forEach((f) => {
    gatherTypes(ts.createSourceFile(f[0], f[1], ts.ScriptTarget.ES2015, true));
  });

  fileContents.forEach((f) => {
    processFile(
        ts.createSourceFile(f[0], f[1], ts.ScriptTarget.ES2015, true), output,
        options);
  });

  return output;
}
